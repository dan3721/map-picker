package com.bush.q3atool;

import com.bush.util.*;
import java.util.*;
import java.io.*;
import java.util.zip.*;
import jargs.gnu.*;
import org.apache.velocity.app.*; 
import org.apache.velocity.*;

public final class Q3ATool 
{

  private static final Runtime _rt = Runtime.getRuntime();

  private static File _q3aHome;
  private static File _workingDir;
  private static File _arenasDir;
  private static File _levelshotsDir;
  private static File _iconsDir;
  private static File _mapsDir;

  private static Properties _props = new Properties();
  private static Properties _vProps = new Properties();
  private static boolean _verbose = false;
  private static boolean _quiet;  

  private static final String Q3ATOOL_PROPERTIES = 
    "q3atool.properties";
  private static final String Q3AVELOCITY_PROPERTIES = 
    "q3a-velocity.properties";

  static 
  { 
    try {    
      _props.load(IOUtil.loadResourceFromClasspath(Q3ATOOL_PROPERTIES)); 
      _vProps.load(IOUtil.loadResourceFromClasspath(Q3AVELOCITY_PROPERTIES)); 
    } catch (IOException ioe) {
      ioe.printStackTrace();
      System.exit(-1);
    }
  }

  private static final void printUsageAndExit() 
  {
    try {    
      System.out.println(new String(IOUtil.loadResourceFromClasspathAsByteArray("USAGE")));
      System.exit(1);
    } catch (IOException ioe) {
      ioe.printStackTrace();
      System.exit(-1);
    }
  }

  public static void main(final String[] args) 
  {

    // create dirs
    _workingDir = new File(System.getProperty("java.io.tmpdir")+File.separator+"out");
    _workingDir.mkdir();
    _arenasDir = new File(_workingDir+File.separator+"arenas");
    _arenasDir.mkdir();
    _levelshotsDir = new File(_workingDir+File.separator+"levelshots");
    _levelshotsDir.mkdir();
    _mapsDir = new File(_workingDir+File.separator+"maps");
    _mapsDir.mkdir();
    _iconsDir = new File(_workingDir+File.separator+"icons");
    _iconsDir.mkdir();
    
    CmdLineParser parser = new CmdLineParser();                             
    CmdLineParser.Option helpOpt = parser.addBooleanOption('h', "help");  
    CmdLineParser.Option verboseOpt = parser.addBooleanOption('v', "verbose");  
    CmdLineParser.Option processPK3FilesOpt = parser.addBooleanOption('p', "process-pk3-files");  
    CmdLineParser.Option genMapIndexOpt = parser.addBooleanOption('m', "gen-map-index");  
    CmdLineParser.Option genIconIndexOpt = parser.addBooleanOption('i', "gen-icon-index");  
    CmdLineParser.Option quietOpt = parser.addBooleanOption('q', "quiet");  
    CmdLineParser.Option q3aHomeOpt = parser.addStringOption('Q', "q3a-home");  

    try { parser.parse(args); }
    catch (CmdLineParser.OptionException e) {   
      out("*** "+e.getMessage()+" ***");
      printUsageAndExit();                                                       
    }     

    try {

      _verbose = 
	((Boolean)parser.getOptionValue(verboseOpt, Boolean.FALSE)).booleanValue(); 

      _quiet = 
	((Boolean)parser.getOptionValue(quietOpt, Boolean.FALSE)).booleanValue(); 

      verbose(Arrays.asList(args));

      if (((Boolean)parser.getOptionValue(helpOpt, Boolean.FALSE)).booleanValue()) {
	printUsageAndExit();                                                       
      }

      String q3aHomeStr = (String)parser.getOptionValue(q3aHomeOpt);
      if (q3aHomeStr == null) {
	printUsageAndExit();                                                       
      }

      _q3aHome = new File(q3aHomeStr);
      verbose("Q3AHOME "+_q3aHome);
      if (!_q3aHome.isDirectory()) {
	err("q3aHome must be a directory.");
	System.exit(-1);
      }

      // process pk3 files
      if (((Boolean)parser.getOptionValue(processPK3FilesOpt, Boolean.FALSE)).booleanValue()) {
	preProcessPK3Files();
	System.exit(0);
      }

      // gen map index
      if (((Boolean)parser.getOptionValue(genMapIndexOpt, Boolean.FALSE)).booleanValue()) {
	genMapIndex();
	System.exit(0);
      }
    
      // gen icon index
      if (((Boolean)parser.getOptionValue(genIconIndexOpt, Boolean.FALSE)).booleanValue()) {
	genIconIndex();
	System.exit(0);
      }
    
      System.exit(0);
      
    } catch (Exception e) {
      e.printStackTrace();
      System.exit(-1);
    }
    
  }

  private static final void genIconIndex() throws Exception 
  {
    List iconFiles = getIconFiles();
    List icons = new ArrayList(iconFiles.size());
    for (int i=0; i<=iconFiles.size()-1; i++) {
      File iconFile = (File)iconFiles.get(i);
      String name = iconFile.getName();
      verbose("PROCESS "+name+" ("+i+" of "+iconFiles.size()+")");
      icons.add(0, name);
    }
    FileWriter writer = new FileWriter(_iconsDir+File.separator+"icon-index.html");
    VelocityEngine ve = new VelocityEngine();
    ve.init(_vProps);
    VelocityContext ctx = new VelocityContext();
    ctx.put("icons", icons);
    ve.getTemplate("icon-index.vm").merge(ctx, writer);
    writer.close();
    out("Generated Icon Index");
  }

  private static final void genMapIndex() throws Exception 
  {
    // sort by name and group by type
    // 	Collections.sort(arenas, new Comparator() {
    // 	    public int compare(Object o1, Object o2) {
    // 	      Q3Arena a1 = (Q3Arena)o1;
    // 	      Q3Arena a2 = (Q3Arena)o2;
    // 	      return a1.getLongName().compareTo(a2.getLongName());
    // 	    }
    // 	  });
    
    // create arenas
    List arenaFiles = getArenaFiles();
    List arenas = new ArrayList(arenaFiles.size());
    for (int i=0; i<=arenaFiles.size()-1; i++) {
      File arenaFile = (File)arenaFiles.get(i);
      verbose("PROCESS "+arenaFile.getName()+" ("+i+" of "+arenaFiles.size()+")");
      BufferedReader r = new BufferedReader(new FileReader(arenaFile));
      StringWriter w = new StringWriter();
      String line = null;
      while ((line = r.readLine()) != null) {
	w.write(line);
      }
      w.close();
      r.close();

      String [] mapRegistrations = w.toString().split("}");
      for (int k=0; k<mapRegistrations.length; k++) {
	String reg = mapRegistrations[k];
	if (reg.trim().length() != 0) {
	  verbose("PROCESS map reg: "+reg);
	  arenas.add(new Q3Arena(reg, arenaFile.getName()));
	}
      }
    }

    FileWriter writer = new FileWriter(_mapsDir+File.separator+"map-index.html");
    VelocityEngine ve = new VelocityEngine();
    ve.init(_vProps);
    VelocityContext ctx = new VelocityContext();
    ctx.put("arenas", arenas);
    ve.getTemplate("map-index.vm").merge(ctx, writer);
    writer.close();
    out("Generated Map Index");
  }
  
  private static final void preProcessPK3Files() throws Exception 
  {
    // pull everything out of the pk3s
    List maps = getPK3Files();
    for (int m=0; m<=maps.size()-1; m++) {
      File mapArchive = (File)maps.get(m);
      verbose("PROCESS pk3 "+mapArchive+" ("+m+" of "+maps.size()+")");
      ZipInputStream in = new ZipInputStream(new FileInputStream(mapArchive));
      ZipEntry entry = null;
      int n = 0;
      while ((entry = in.getNextEntry()) != null) {
	n++;
	String name = entry.getName();

	// .arena
	if (name.endsWith(".arena")) { 
	  extract(in, _arenasDir, "ARENA", name.toLowerCase(), 512); 
	}
	
	// levelshots
	else if (name.matches("levelshots/.++")) {
	  extract(in, _levelshotsDir, "LSHOT", name.toLowerCase(), 4096);
	}

	// default_icon
	if (name.indexOf("icon_default") != -1) { 

	  // derive player name
	  int pIdx = name.indexOf("/players/");
	  String playerName = name.substring(pIdx+9, name.indexOf('/', pIdx+10));
	  verbose("playerName:["+playerName+"]");

	  extract(in, _iconsDir, "ICON", playerName+name.substring(name.lastIndexOf('.')), 1024); 
	}
	
      }
      in.close();
    }
    out("Processed pk3 Files");
  }
  
  private static final void extract(InputStream in, File dir, String key, String file, int size) 
    throws Exception 
  {
    verbose("file: "+file);
    int idx = file.lastIndexOf("/");
    if (idx != -1) {
      file = file.substring(idx+1);
    }
    File f = new File(dir+File.separator+file);
    verbose("file: "+f);
    OutputStream out = new FileOutputStream(f);
    byte [] buff = new byte [size];
    int bytes = -1;
    while ((bytes = in.read(buff)) != -1) {
      out.write(buff, 0, bytes);
    }
    out.close();
    verbose("EXTRACT "+key+" "+file);
  }

  private static final List getPK3Files() 
  {
    return getFiles(new ArrayList(), _q3aHome, new FileFilter() {
	public boolean accept(File pathname) {
	  if (pathname.isDirectory()) { return true; }
	  return pathname.getName().endsWith(".pk3");
	}
      }, true);
  } 
  
  private static final List getArenaFiles() 
  {
    return getFiles(new ArrayList(), _arenasDir, new FileFilter() {
    	public boolean accept(File pathname) {
    	  if (pathname.isDirectory()) { return true; }
    	  return pathname.getName().endsWith(".arena");
    	}
      }, false);
  } 
  
  private static final List getIconFiles() 
  {
    return getFiles(new ArrayList(), _iconsDir, new FileFilter() {
    	public boolean accept(File pathname) {
    	  if (pathname.isDirectory()) { return true; }
    	  return pathname.getName().endsWith(".jpg");
    	}
      }, false);
    //    return Arrays.asList(_iconsDir.listFiles());
  } 

  private static final List getFiles(List files, File dir, FileFilter filter, boolean recursive) 
  {
    File [] fileList = filter == null ? dir.listFiles() : dir.listFiles(filter);
    for (int i=0; i<fileList.length; i++) {
      File file = (File)fileList[i];
      if (file.isDirectory()) {
	if (recursive) {
	  getFiles(files, file, filter, true);
	}
      }
      else {
	files.add(file);
      }
    }
    return files;
  }
  
  private static final void verbose(Object obj) 
  {
    if (_verbose) { System.out.println(obj); }
  }
  
  private static final void out(Object obj) 
  {
    if (!_quiet) { System.out.println(obj); }
  }
  
  private static final void out(String [] obj) 
  {
    if (!_quiet) { 
      for (int i=0; i<obj.length; i++) {
	System.out.println(obj[i]+" "); 
      }
      System.out.println(); 
    }
  }

  private static final void err(Object obj) 
  {
    if (!_quiet) { System.err.println(obj); }
  }
  
}
